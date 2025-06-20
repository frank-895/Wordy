from rest_framework.response import Response
from rest_framework import status

class SessionMissingException(Exception):
    pass

class RequireSessionMixin:
    """
    Mixin that can be used inside view methods (not dispatch).
    """

    def get_session_id(self, request):
        # This will work inside view methods like post(), get(), etc.
        session_id = (
            request.data.get("session_id")
            or request.query_params.get("session_id")
            or request.POST.get("session_id")
        )
        if not session_id:
            raise SessionMissingException("Missing session_id")
        return session_id
