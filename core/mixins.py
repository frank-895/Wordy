from rest_framework.response import Response
from rest_framework import status

class SessionMissingException(Exception):
    """
    Exception raised when a required session_id is missing from the request.
    """
    pass

class RequireSessionMixin:
    """
    Mixin to be used inside view methods (not dispatch) to enforce the presence of a session_id.
    Provides a helper method to extract session_id from request data or query params.
    """

    def get_session_id(self, request):
        """
        Retrieve the session_id from the request data, query parameters, or POST data.
        Raises:
            SessionMissingException: If session_id is not found in the request.
        Returns:
            str: The session_id value from the request.
        """
        session_id = (
            request.data.get("session_id")
            or request.query_params.get("session_id")
            or request.POST.get("session_id")
        )
        if not session_id:
            raise SessionMissingException("Missing session_id")
        return session_id
