import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
    Column, CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';

@Entity()
@ObjectType()
export class UserDetails {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Field()
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Field()
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field({ nullable: true })
  fullname: string;

  @Column({ type: 'int', nullable: true })
  @Field(() => Int, { nullable: true })
  age: number;

  @OneToOne(() => User, (user) => user.details)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
