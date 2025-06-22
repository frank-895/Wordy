from django.contrib import admin
from .models import Template

# Register your models here.
@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at')