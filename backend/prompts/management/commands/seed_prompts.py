"""
Management command to seed the database with default system prompts.
"""
from django.core.management.base import BaseCommand
from prompts.models import PromptTemplate


DEFAULT_PROMPTS = [
    {
        'title': 'Bug Hunter',
        'slug': 'bug-hunter',
        'description': 'Analyze code for bugs, edge cases, and security vulnerabilities.',
        'content': (
            'Analyze the following code thoroughly for bugs, edge cases, security vulnerabilities, '
            'and potential performance issues. For each issue found, explain:\n'
            '1. What the bug is\n'
            '2. Why it happens\n'
            '3. How to fix it\n\n'
            'Code to analyze:\n{code}'
        ),
        'category': 'debug',
    },
    {
        'title': 'Code Refactor',
        'slug': 'code-refactor',
        'description': 'Refactor code following SOLID principles and best practices.',
        'content': (
            'Refactor the following code to improve readability, maintainability, and performance. '
            'Apply SOLID principles, modern design patterns, and clean code best practices. '
            'Explain each change you make and why.\n\n'
            'Code:\n{code}'
        ),
        'category': 'coding',
    },
    {
        'title': 'Explain Like I\'m 5',
        'slug': 'eli5',
        'description': 'Explain a complex topic in simple, easy-to-understand terms.',
        'content': (
            'Explain the following concept in the simplest possible terms, as if explaining to a complete beginner. '
            'Use analogies, metaphors, and real-world examples. Avoid jargon.\n\n'
            'Topic: {topic}'
        ),
        'category': 'general',
    },
    {
        'title': 'API Doc Generator',
        'slug': 'api-doc',
        'description': 'Generate comprehensive API documentation from code.',
        'content': (
            'Generate comprehensive API documentation for the following code. Include:\n'
            '- Endpoint description\n'
            '- Request parameters (type, required, description)\n'
            '- Response format (with example JSON)\n'
            '- Error codes\n'
            '- Usage example with cURL\n\n'
            'Code:\n{code}'
        ),
        'category': 'coding',
    },
    {
        'title': 'Data Story',
        'slug': 'data-story',
        'description': 'Turn raw data into a compelling narrative with insights.',
        'content': (
            'Analyze the following data and create a compelling narrative. Include:\n'
            '1. Key findings and trends\n'
            '2. Statistical insights\n'
            '3. Actionable recommendations\n'
            '4. Potential risks or anomalies\n\n'
            'Data:\n{data}'
        ),
        'category': 'analysis',
    },
    {
        'title': 'Creative Brief',
        'slug': 'creative-brief',
        'description': 'Generate creative content based on a brief description.',
        'content': (
            'Based on the following brief, generate creative content that is engaging, original, and impactful. '
            'Consider the target audience, tone, and key message.\n\n'
            'Brief: {brief}'
        ),
        'category': 'writing',
    },
    {
        'title': 'System Design',
        'slug': 'system-design',
        'description': 'Design a scalable system architecture for a given requirement.',
        'content': (
            'Design a scalable system architecture for the following requirement. Include:\n'
            '1. High-level architecture diagram (described in text)\n'
            '2. Component breakdown\n'
            '3. Data flow\n'
            '4. Technology choices with justification\n'
            '5. Scaling strategy\n'
            '6. Potential bottlenecks\n\n'
            'Requirement: {requirement}'
        ),
        'category': 'coding',
    },
    {
        'title': 'SQL Query Builder',
        'slug': 'sql-query',
        'description': 'Generate optimized SQL queries from natural language.',
        'content': (
            'Generate an optimized SQL query for the following request. '
            'Provide the query, explain each part, and suggest any indexes that would improve performance.\n\n'
            'Database schema (if provided): {schema}\n'
            'Request: {request}'
        ),
        'category': 'coding',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with default system prompt templates.'

    def handle(self, *args, **options):
        created_count = 0
        for prompt_data in DEFAULT_PROMPTS:
            _, created = PromptTemplate.objects.get_or_create(
                slug=prompt_data['slug'],
                is_system=True,
                defaults={
                    **prompt_data,
                    'is_public': True,
                    'is_system': True,
                    'user': None,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {prompt_data['title']}"))
            else:
                self.stdout.write(f"  Skipped (exists): {prompt_data['title']}")

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {created_count} new prompts.'))
