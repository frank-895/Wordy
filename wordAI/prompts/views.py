from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import openai

openai.api_key = settings.OPENAI_API_KEY

class SimplePromptView(APIView):
    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",  # or "gpt-3.5-turbo"
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )

            return Response({'response': response.choices[0].message['content'].strip()})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
