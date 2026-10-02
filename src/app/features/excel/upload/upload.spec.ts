import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { UploadComponent } from './upload';

describe('Upload', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve([])
  });

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('alert', vi.fn());

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept Excel and PDF files', () => {
    const xlsxFile = new File(['data'], 'reporte.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const pdfFile = new File(['data'], 'reporte.pdf', { type: 'application/pdf' });

    component.onFileSelected(createFileInputEvent(xlsxFile));
    expect(component.selectedFile).toBe(xlsxFile);

    component.onFileSelected(createFileInputEvent(pdfFile));
    expect(component.selectedFile).toBe(pdfFile);
  });

  it('should reject files that are not Excel or PDF', () => {
    const textFile = new File(['data'], 'notas.txt', { type: 'text/plain' });

    component.onFileSelected(createFileInputEvent(textFile));

    expect(component.selectedFile).toBeNull();
    expect(alert).toHaveBeenCalledWith('Solo se permiten archivos Excel (.xls, .xlsx) o PDF (.pdf).');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

function createFileInputEvent(file: File): Event {
  const input = document.createElement('input');
  input.type = 'file';

  Object.defineProperty(input, 'files', {
    value: [file]
  });

  return { target: input } as unknown as Event;
}