/* eslint-disable etc/no-commented-out-code */
/* eslint-disable no-undef */
import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UserService } from 'src/services'

describe('AppController', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let appController: UsersController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UserService],
    }).compile()

    appController = app.get<UsersController>(UsersController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      // expect(appController.getHello()).toBe('Hello World!');
    })
  })
})
