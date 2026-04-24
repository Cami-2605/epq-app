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

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});