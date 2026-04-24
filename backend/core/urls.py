from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "status": "Success! The Django Backend server is actively running.",
        "message": "This is purely an API server. To see the application interface, please open your React frontend in the browser (usually http://localhost:5173 or http://localhost:5174)."
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include('sms.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
