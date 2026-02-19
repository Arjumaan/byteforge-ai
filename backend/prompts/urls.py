from django.urls import path
from . import views

urlpatterns = [
    path('', views.PromptListView.as_view(), name='prompt-list'),
    path('create/', views.PromptCreateView.as_view(), name='prompt-create'),
    path('<int:prompt_id>/', views.PromptDetailView.as_view(), name='prompt-detail'),
    path('<int:prompt_id>/use/', views.PromptUseView.as_view(), name='prompt-use'),
]
