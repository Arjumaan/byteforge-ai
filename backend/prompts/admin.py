from django.contrib import admin
from .models import PromptTemplate


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_public', 'is_system', 'usage_count', 'created_at']
    list_filter = ['category', 'is_public', 'is_system']
    search_fields = ['title', 'description', 'content']
    readonly_fields = ['slug', 'usage_count', 'created_at', 'updated_at']
