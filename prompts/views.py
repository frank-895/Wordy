from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from openai import OpenAI  # using the new v1 OpenAI client
import json  # you forgot to import json
from core.mixins import RequireSessionMixin

client = OpenAI(api_key=settings.OPENAI_API_KEY)

class StructuredPromptView(RequireSessionMixin, APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # System message to guide GPT
            system_instruction = (
                "You are a Word document assistant. "
                "Only return JSON with an 'action' key and optional 'style' or 'content' keys. "
                "DO NOT explain or include extra text. Only return the JSON.\n\n"
                "Supported actions:\n"
                "- format: apply styling (e.g., color, bold)\n"
                "- replace: replace text\n"
                "Example:\n"
                "{ \"action\": \"format\", \"style\": { \"color\": \"green\" } }"
            )

            response = client.chat.completions.create( 
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=200
            )

            raw_output = response.choices[0].message.content.strip()

            # Attempt to parse the output as JSON
            try:
                parsed = json.loads(raw_output)
                return Response(parsed)
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Model returned non-JSON output', 'raw': raw_output},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
