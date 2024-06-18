import { Injectable } from '@nestjs/common';

import { CacheService } from '../base-cache.service';

@Injectable()
export class UserCacheService extends CacheService {}
