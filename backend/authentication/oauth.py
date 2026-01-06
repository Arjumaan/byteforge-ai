"""
OAuth pipeline functions.
"""
from rest_framework_simplejwt.tokens import RefreshToken


def create_jwt_token(strategy, details, user=None, *args, **kwargs):
    """Create JWT token after successful OAuth authentication."""
    if user:
        refresh = RefreshToken.for_user(user)
        
        # Update user provider info if needed
        backend_name = kwargs.get('backend', {})
        if hasattr(backend_name, 'name'):
            provider = backend_name.name.replace('-', '_').replace('oauth2', '').strip('_')
            if provider in ['google', 'github', 'apple', 'gitlab']: 
                user.provider = provider
                user.save(update_fields=['provider'])
        
        # Store token in session for redirect
        strategy.session_set('jwt_access_token', str(refresh.access_token))
        strategy.session_set('jwt_refresh_token', str(refresh))
        
        return {
            'jwt_access_token': str(refresh.access_token),
            'jwt_refresh_token': str(refresh),
        }