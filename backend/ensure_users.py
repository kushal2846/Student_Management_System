import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

def setup_users():
    # Setup Admin
    admin_user, created = User.objects.get_or_create(username='admin')
    admin_user.set_password('Admin@123')
    admin_user.email = 'admin@example.com'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    print("Admin user configured with 'Admin@123'")

    # Setup standard User
    standard_user, created = User.objects.get_or_create(username='user')
    standard_user.set_password('User@123')
    standard_user.email = 'user@example.com'
    standard_user.is_staff = False
    standard_user.is_superuser = False
    standard_user.save()
    print("Standard user configured with 'User@123'")

if __name__ == '__main__':
    setup_users()
