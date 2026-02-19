from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'file_type', 'status', 'chunk_count', 'created_at']
    list_filter = ['status', 'file_type']
    search_fields = ['title', 'user__email']
    readonly_fields = ['file_type', 'file_size', 'chunk_count', 'error_message', 'created_at', 'updated_at']
