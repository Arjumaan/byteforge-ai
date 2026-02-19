from django.db import models
from django.conf import settings


class PromptTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('coding', 'Coding'),
        ('writing', 'Writing'),
        ('analysis', 'Analysis'),
        ('debug', 'Debug'),
        ('general', 'General'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prompt_templates',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, blank=True)
    description = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(help_text="The prompt template text. Use {variable} for placeholders.")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    is_public = models.BooleanField(default=False, help_text="Public prompts are visible to all users.")
    is_system = models.BooleanField(default=False, help_text="System prompts cannot be deleted by users.")
    usage_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-usage_count', '-created_at']
        unique_together = ['user', 'slug']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
