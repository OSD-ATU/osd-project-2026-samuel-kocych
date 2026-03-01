import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ExternalRecipeService } from './external-recipe.service';

describe('ExternalRecipeService', () => {
  let service: ExternalRecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ExternalRecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
