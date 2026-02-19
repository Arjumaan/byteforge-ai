import threading
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from .services import process_document, query_knowledge_base, delete_document_from_index


class DocumentListView(APIView):
    """List all documents for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = Document.objects.filter(user=request.user)
        serializer = DocumentSerializer(documents, many=True)
        return Response({
            'success': True,
            'documents': serializer.data
        })


class DocumentUploadView(APIView):
    """Upload a new document and kick off RAG processing."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        title = serializer.validated_data.get('title', '') or file.name.rsplit('.', 1)[0]

        document = Document.objects.create(
            user=request.user,
            title=title,
            file=file,
            status='processing'
        )

        # Process in a background thread to avoid blocking the response
        thread = threading.Thread(target=process_document, args=(document,))
        thread.daemon = True
        thread.start()

        return Response({
            'success': True,
            'message': 'Document uploaded. Processing started.',
            'document': DocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)


class DocumentDeleteView(APIView):
    """Delete a specific document and its vector index."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Document not found.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Delete from vector store first
        delete_document_from_index(document)
        document.delete()

        return Response({
            'success': True,
            'message': 'Document deleted.'
        })


class KnowledgeQueryView(APIView):
    """Query the knowledge base for relevant context (used by chat)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '')
        document_ids = request.data.get('document_ids', None)
        n_results = request.data.get('n_results', 3)

        if not query:
            return Response({
                'success': False,
                'message': 'Query text is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        results = query_knowledge_base(
            user_id=request.user.id,
            query_text=query,
            n_results=n_results,
            document_ids=document_ids,
        )

        return Response({
            'success': True,
            'results': results,
            'count': len(results)
        })
