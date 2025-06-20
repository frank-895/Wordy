from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.mixins import RequireSessionMixin
from documents.services.embedding import get_relevant_chunks
from .utils.client import format_context_prompt, llm_chat_json

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
