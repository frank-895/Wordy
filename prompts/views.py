from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from openai import OpenAI  # using the new v1 OpenAI client
from core.mixins import RequireSessionMixin
from documents.services.embedding import get_relevant_chunks
from .utils.client import format_context_prompt, llm_chat_json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

class StructuredPromptView(RequireSessionMixin, APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session_id = self.get_session_id(request)
            context_chunks = get_relevant_chunks(prompt, session_id)
            system_msg, user_msg = format_context_prompt(prompt, context_chunks)
            result = llm_chat_json(user_msg, system_msg)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

        if result["success"]:
            return Response(result["data"])
        elif "raw" in result:
            return Response(
                {'error': result['error'], 'raw': result['raw']},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        else:
            return Response({'error': result['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class WordyCommandView(APIView):
    """
    API endpoint for processing @wordy commands from the frontend.
    Takes the text between @wordy and . and generates appropriate content.
    """
    
    def post(self, request):
        command_text = request.data.get('command_text')
        content_type = request.data.get('content_type', 'general')
        
        if not command_text:
            return Response({
                'error': 'command_text is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create a comprehensive system prompt for content generation
            system_instruction = self._get_system_instruction(content_type)
            
            # Create the user prompt based on the command text
            user_prompt = f"Generate content based on this request: {command_text}"
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )

            generated_content = response.choices[0].message.content.strip()
            
            return Response({
                'success': True,
                'content': generated_content,
                'command_text': command_text,
                'content_type': content_type
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_system_instruction(self, content_type):
        """Get appropriate system instruction based on content type."""
        
        base_instruction = (
            "You are a professional writing assistant integrated into Microsoft Word. "
            "Generate high-quality, contextually appropriate content based on user requests. "
            "Your responses should be ready to insert directly into a document. "
            "Maintain a professional tone and provide well-structured content."
        )
        
        content_specific_instructions = {
            'email': (
                "Focus on professional email communication. "
                "Include appropriate greetings, clear messaging, and professional closings. "
                "Structure emails with clear subject lines and proper business etiquette."
            ),
            'report': (
                "Generate structured report content with clear headings, data analysis, "
                "and actionable insights. Use bullet points and organized sections when appropriate."
            ),
            'proposal': (
                "Create compelling proposal content that includes problem statements, "
                "solutions, benefits, and clear calls to action. Focus on persuasive language."
            ),
            'summary': (
                "Provide concise summaries that capture key points and main ideas. "
                "Use clear, direct language and highlight the most important information."
            ),
            'general': (
                "Generate appropriate content based on the context provided. "
                "Adapt your writing style to match the apparent intent of the request."
            )
        }
        
        specific_instruction = content_specific_instructions.get(content_type, content_specific_instructions['general'])
        
        return f"{base_instruction}\n\n{specific_instruction}"
