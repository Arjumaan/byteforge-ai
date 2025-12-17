from django.urls import path
from . import views

urlpatterns = [
    path('create', views.create_payment_view, name='create_payment'),
    path('history', views.payment_history_view, name='payment_history'),
]
