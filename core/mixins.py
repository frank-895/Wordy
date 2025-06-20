from rest_framework.response import Response
from rest_framework import status

class RequireSessionMixin:
    """
    Mixin to ensure that a 'session_id' is present in the request data (for POST/PUT/PATCH)
    or in the query parameters (for GET/DELETE). Returns a 400 error if missing.
    Should be used with APIView or its subclasses.
    """
    def dispatch(self, request, *args, **kwargs):
        session_id = None
        if request.method in ['GET', 'DELETE']:
            session_id = request.query_params.get('session_id')
        else:
            session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'Missing session_id'}, status=status.HTTP_400_BAD_REQUEST)
        return super().dispatch(request, *args, **kwargs)
