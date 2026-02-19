from rest_framework import serializers
from .models import PromptTemplate


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = [
            'id', 'title', 'slug', 'description', 'content',
            'category', 'is_public', 'is_system', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'is_system', 'usage_count', 'created_at', 'updated_at']


class CreatePromptSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, max_length=255)
    content = serializers.CharField()
    category = serializers.ChoiceField(
        choices=PromptTemplate.CATEGORY_CHOICES,
        default='general'
    )
    is_public = serializers.BooleanField(default=False)
