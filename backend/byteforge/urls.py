"""
URL configuration for ByteForge AI project.
"""
from django.contrib import admin
from django.urls import path, include

from django.http import HttpResponse

def home(request):
    return HttpResponse("ByteForge AI Backend is running!")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/payments/', include('payments.urls')),
    path('oauth/', include('social_django.urls', namespace='social')),
]