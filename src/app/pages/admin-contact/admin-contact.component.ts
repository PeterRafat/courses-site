import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ContactForm } from '../../models/entities';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-contact.component.html',
  styleUrls: ['./admin-contact.component.css']
})
export class AdminContactComponent implements OnInit {
  contacts: ContactForm[] = [];
  selectedContact: ContactForm | null = null;
  loading = false;
  showDetailsModal = false;
  // Cache for contact details to speed up modal opening
  private contactCache: Map<number, ContactForm> = new Map();

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading = true;
    this.adminService.getContactForms().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.loading = false;
      }
    });
  }

  viewContactDetails(contactId: number): void {
    // Check if we have cached data
    if (this.contactCache.has(contactId)) {
      this.selectedContact = this.contactCache.get(contactId)!;
      this.showDetailsModal = true;
      return;
    }
    
    // Fetch from API if not cached
    this.adminService.getContactForm(contactId).subscribe({
      next: (contact) => {
        this.selectedContact = contact;
        this.showDetailsModal = true;
        // Cache the result for future use
        this.contactCache.set(contactId, contact);
      },
      error: (error) => {
        console.error('Error loading contact details:', error);
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedContact = null;
  }

  deleteContact(contactId: number): void {
    if (confirm('هل أنت متأكد من حذف هذا النموذج؟')) {
      this.adminService.deleteContactForm(contactId).subscribe({
        next: () => {
          // Remove the contact from the list
          this.contacts = this.contacts.filter(contact => contact.id !== contactId);
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}