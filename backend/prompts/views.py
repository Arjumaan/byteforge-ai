from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import PromptTemplate
from .serializers import PromptTemplateSerializer, CreatePromptSerializer


class PromptListView(APIView):
    """List all prompts available to the user (own + public)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', '')

        # User's own prompts + all public/system prompts
        prompts = PromptTemplate.objects.filter(
            Q(user=request.user) | Q(is_public=True) | Q(is_system=True)
        )

        if search:
            prompts = prompts.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        if category:
            prompts = prompts.filter(category=category)

        serializer = PromptTemplateSerializer(prompts, many=True)
        return Response({
            'success': True,
            'prompts': serializer.data
        })


class PromptCreateView(APIView):
    """Create a new prompt template."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreatePromptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        prompt = PromptTemplate.objects.create(
            user=request.user,
            **serializer.validated_data
        )

        return Response({
            'success': True,
            'message': 'Prompt created.',
            'prompt': PromptTemplateSerializer(prompt).data
        }, status=status.HTTP_201_CREATED)


class PromptDetailView(APIView):
    """Get, update, or delete a specific prompt."""
    permission_classes = [IsAuthenticated]

    def get(self, request, prompt_id):
        try:
            prompt = PromptTemplate.objects.get(
                Q(id=prompt_id),
                Q(user=request.user) | Q(is_public=True) | Q(is_system=True)
            )
        except PromptTemplate.DoesNotExist:
            return Response({'success': False, 'message': 'Prompt not found.'}, status=404)

        return Response({
            'success': True,
            'prompt': PromptTemplateSerializer(prompt).data
        })

    def put(self, request, prompt_id):
        try:
            prompt = PromptTemplate.objects.get(id=prompt_id, user=request.user)
        except PromptTemplate.DoesNotExist:
            return Response({'success': False, 'message': 'Prompt not found.'}, status=404)

        if prompt.is_system:
            return Response({'success': False, 'message': 'Cannot edit system prompts.'}, status=403)

        for field in ['title', 'description', 'content', 'category', 'is_public']:
            if field in request.data:
                setattr(prompt, field, request.data[field])
        prompt.save()

        return Response({
            'success': True,
            'prompt': PromptTemplateSerializer(prompt).data
        })

    def delete(self, request, prompt_id):
        try:
            prompt = PromptTemplate.objects.get(id=prompt_id, user=request.user)
        except PromptTemplate.DoesNotExist:
            return Response({'success': False, 'message': 'Prompt not found.'}, status=404)

        if prompt.is_system:
            return Response({'success': False, 'message': 'Cannot delete system prompts.'}, status=403)

        prompt.delete()
        return Response({'success': True, 'message': 'Prompt deleted.'})


class PromptUseView(APIView):
    """Increment usage count when a prompt is used."""
    permission_classes = [IsAuthenticated]

    def post(self, request, prompt_id):
        try:
            prompt = PromptTemplate.objects.get(
                Q(id=prompt_id),
                Q(user=request.user) | Q(is_public=True) | Q(is_system=True)
            )
        except PromptTemplate.DoesNotExist:
            return Response({'success': False, 'message': 'Prompt not found.'}, status=404)

        prompt.usage_count += 1
        prompt.save(update_fields=['usage_count'])

        return Response({
            'success': True,
            'prompt': PromptTemplateSerializer(prompt).data
        })
