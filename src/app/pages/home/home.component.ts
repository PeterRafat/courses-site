import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { ContactForm, ContactFormCreate } from '../../models/entities';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  contactFormModel: ContactFormCreate = {
    name: '',
    email: '',
    number: '',
    text: ''
  };
  
  isSubmitting = false;
  
  constructor(private contactService: ContactService) {}
  
  submitContactForm(): void {
    if (!this.contactFormModel.name || !this.contactFormModel.email || !this.contactFormModel.number || !this.contactFormModel.text) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    this.isSubmitting = true;
    
    this.contactService.submitContactForm(this.contactFormModel).subscribe({
      next: (response: ContactForm) => {
        this.isSubmitting = false;
        alert('تم إرسال رسالتك بنجاح! سنقوم بالتواصل معك في أقرب وقت.');
        // Reset form
        this.contactFormModel = {
          name: '',
          email: '',
          number: '',
          text: ''
        };
      },
      error: (error: any) => {
        this.isSubmitting = false;
        console.error('Error submitting contact form:', error);
        alert('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
      }
    });
  }
}
