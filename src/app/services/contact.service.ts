import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactForm, ContactFormCreate } from '../models/entities';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  submitContactForm(form: ContactFormCreate): Observable<ContactForm> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ContactForm>(`${this.baseUrl}/Contact`, form, { headers });
  }
}