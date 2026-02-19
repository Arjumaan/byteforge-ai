from django.urls import path
from . import views

urlpatterns = [
    path('documents/', views.DocumentListView.as_view(), name='document-list'),
    path('documents/upload/', views.DocumentUploadView.as_view(), name='document-upload'),
    path('documents/<int:document_id>/', views.DocumentDeleteView.as_view(), name='document-delete'),
    path('query/', views.KnowledgeQueryView.as_view(), name='knowledge-query'),
]
