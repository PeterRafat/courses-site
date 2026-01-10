import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { ContactForm, ContactFormCreate } from '../../models/entities';
import { ToastrService } from 'ngx-toastr';

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
  
  constructor(private contactService: ContactService, private toastr: ToastrService) {}
  
  submitContactForm(): void {
    if (!this.contactFormModel.name || !this.contactFormModel.email || !this.contactFormModel.number || !this.contactFormModel.text) {
      this.toastr.error('يرجى ملء جميع الحقول المطلوبة', 'خطأ');
      return;
    }
    
    this.isSubmitting = true;
    
    this.contactService.submitContactForm(this.contactFormModel).subscribe({
      next: (response: ContactForm) => {
        this.isSubmitting = false;
        this.toastr.success('تم إرسال رسالتك بنجاح! سنقوم بالتواصل معك في أقرب وقت.', 'نجاح');
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
        this.toastr.error('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.', 'خطأ');
      }
    });
  }
}
