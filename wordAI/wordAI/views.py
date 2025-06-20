from django.shortcuts import render


def index(request):
    """Serve the React frontend."""
    return render(request, 'base.html') 