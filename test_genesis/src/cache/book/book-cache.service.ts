import { Injectable } from '@nestjs/common';
import { CacheService } from '../base-cache.service';

@Injectable()
export class BookCacheService extends CacheService {}
