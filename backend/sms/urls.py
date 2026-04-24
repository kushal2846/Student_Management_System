from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (StudentViewSet, AttendanceViewSet, SubjectMarkViewSet,
                    CourseViewSet, ScheduleViewSet, ExamViewSet, HomeworkViewSet,
                    LibraryViewSet, FinanceRecordViewSet, AnnouncementViewSet, CoursePlanViewSet, get_me)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'marks', SubjectMarkViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'schedule', ScheduleViewSet)
router.register(r'exams', ExamViewSet)
router.register(r'homeworks', HomeworkViewSet)
router.register(r'library', LibraryViewSet)
router.register(r'finance', FinanceRecordViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'course-plans', CoursePlanViewSet)

urlpatterns = [
    path('auth/me/', get_me, name='auth_me'),
    path('', include(router.urls)),
]
