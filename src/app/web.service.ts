import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpEvent, HttpRequest, HttpParams } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { switchMap, takeWhile, catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class WebService {

  private readonly base = environment.apiBase;

  constructor(private http: HttpClient) { }

  signUp(data: any) {
    return this.http.post(`${this.base}/users/createUser`, data);
  }

  signIn(data: any) {
    return this.http.post(`${this.base}/users/login`, data);
  }

  // ---------- Categories ----------
  listCategories() {
    return this.http.get(`${this.base}/category/getCategories`);
  }

  createCategory(payload: any) {
    return this.http.post(`${this.base}/category/addCategory`, payload);
  }

  updateCategory(id: string, payload: any) {
    return this.http.post(`${this.base}/category/updateCategory/${id}`, payload);
  }

  deleteCategory(id: string) {
    return this.http.post<void>(`${this.base}/category/deleteCategory/${id}`, '');
  }

  // ---------- Products ----------
  // listProducts() {
  //   return this.http.get(`${this.base}/product/getProducts`);
  // }

  listProducts(opts: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 1))
      .set('limit', String(opts.limit ?? 10));

    if (opts.search) params = params.set('search', opts.search);

    return this.http.get<{ status: number; products: any[]; pagination: {
      currentPage: number; perPage: number; total: number; totalPages: number;
    }}>(this.base + '/product/getProducts', { params });
  }

  createProduct(payload: any) {
    return this.http.post(`${this.base}/product/addProduct`, payload);
  }

  updateProduct(payload: any) {
    return this.http.post(`${this.base}/product/updateProduct`, payload);
  }

  deleteProduct(id: string) {
    return this.http.post<void>(`${this.base}/product/deleteProduct/${id}`, '');
  }

  uploadProductExel(formData: any) {
    return this.http.post<void>(`${this.base}/product/uploadProduct/bulk`, formData);
    // return this.http.post<void>(`${this.base}/product/uploadProduct`, formData);

  }

  pollJobStatus(jobId: string): Observable<any> {
    return timer(0, 2000).pipe(
      switchMap(() =>
        this.http.get<any>(`${this.base}/product/job-status/${jobId}`)
      ),
      takeWhile(
        (status) => status.state != 'completed' && status.state != 'failed',
        true // include the last emission (when it completes/fails)
      )
    );
  }

  exportProducts() {
    return this.http.get(`${this.base}/product/export`, {
      responseType: 'blob',
      observe: 'response'
    });
  };
}

