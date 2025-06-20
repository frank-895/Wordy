from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from openai import OpenAI  # using the new v1 OpenAI client
import json  # you forgot to import json
from core.mixins import RequireSessionMixin
from .utils import llm_chat_json

client = OpenAI(api_key=settings.OPENAI_API_KEY)

class StructuredPromptView(RequireSessionMixin, APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

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

        result = llm_chat_json(prompt, system_instruction)
        if result["success"]:
            return Response(result["data"])
        elif "raw" in result:
            return Response(
                {'error': result['error'], 'raw': result['raw']},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        else:
            return Response({'error': result['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
