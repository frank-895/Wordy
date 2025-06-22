from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Template, Document, TemplateContext
import json
import uuid


class TemplateContextTests(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create a test template
        self.template = Template.objects.create(
            name="Test Template",
            lexical_json={"root": {"children": []}}
        )
        
        # Create test context documents
        self.context_doc1 = Document.objects.create(
            name="Test Document 1",
            content="This is test content for document 1",
            file_type="text"
        )
        
        self.context_doc2 = Document.objects.create(
            name="Test Document 2", 
            content="This is test content for document 2",
            file_type="text"
        )

    def test_template_context_association(self):
        """Test that context documents can be associated with templates"""
        # Create association
        association = TemplateContext.objects.create(
            template=self.template,
            context_document=self.context_doc1
        )
        
        # Verify association was created
        self.assertEqual(association.template, self.template)
        self.assertEqual(association.context_document, self.context_doc1)
        
        # Verify template has access to context documents
        self.assertEqual(self.template.context_documents.count(), 1)
        # Get the actual document through the association
        associated_doc = self.template.context_documents.first().context_document
        self.assertEqual(associated_doc, self.context_doc1)

    def test_template_context_unique_constraint(self):
        """Test that the same context document cannot be associated with a template twice"""
        # Create first association
        TemplateContext.objects.create(
            template=self.template,
            context_document=self.context_doc1
        )
        
        # Try to create duplicate association
        with self.assertRaises(Exception):  # Should raise IntegrityError
            TemplateContext.objects.create(
                template=self.template,
                context_document=self.context_doc1
            )

    def test_template_context_deletion(self):
        """Test that context associations can be deleted"""
        # Create association
        association = TemplateContext.objects.create(
            template=self.template,
            context_document=self.context_doc1
        )
        
        # Verify it exists
        self.assertEqual(TemplateContext.objects.count(), 1)
        
        # Delete association
        association.delete()
        
        # Verify it's gone
        self.assertEqual(TemplateContext.objects.count(), 0)

    def test_template_context_cascade_deletion(self):
        """Test that context associations are deleted when template is deleted"""
        # Create association
        TemplateContext.objects.create(
            template=self.template,
            context_document=self.context_doc1
        )
        
        # Verify association exists
        self.assertEqual(TemplateContext.objects.count(), 1)
        
        # Delete template
        self.template.delete()
        
        # Verify association is also deleted
        self.assertEqual(TemplateContext.objects.count(), 0)
        
        # Verify context document still exists
        self.assertEqual(Document.objects.count(), 2)
