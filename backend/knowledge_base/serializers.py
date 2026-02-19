from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_type', 'file_size',
            'file_size_display', 'status', 'chunk_count',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'file_size_display',
            'status', 'chunk_count', 'error_message', 'created_at', 'updated_at'
        ]

    def get_file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1048576:
            return f"{obj.file_size / 1024:.1f} KB"
        else:
            return f"{obj.file_size / 1048576:.1f} MB"


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_file(self, value):
        allowed_types = ['pdf', 'txt', 'md', 'csv']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed_types)}"
            )
        # Max file size: 10MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size exceeds 10MB limit.")
        return value
