from django.contrib.auth.decorators import user_passes_test
from rest_framework import status
from rest_framework.response import Response


def json_body(request):
    return getattr(request, 'data', {})


def error(message, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'error': message}, status=status_code)


def success(data=None, status_code=status.HTTP_200_OK):
    payload = {'success': True}
    if data:
        payload.update(data)
    return Response(payload, status=status_code)


def superadmin_required(view_func):
    return user_passes_test(lambda user: user.is_authenticated and user.is_superuser)(view_func)


def current_invite_id(request):
    return request._request.session.get('invite_id') if hasattr(request, '_request') else request.session.get('invite_id')


def current_role(request):
    base_request = request._request if hasattr(request, '_request') else request
    if base_request.user.is_authenticated and base_request.user.is_superuser:
        return 'superadmin'
    return base_request.session.get('role')


def protocol_or_admin(request):
    return current_role(request) in ('protocole', 'superadmin')
