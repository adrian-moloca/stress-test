import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import SendGrid from '@sendgrid/mail'
import { EnvConfigsService } from './envconfigs.service'
import { TranslatorLanguage, emailLogoFile, getFullName } from '@smambu/lib.constantsjs'

@Injectable()
export class SendgridService {
  public sendGridEmail: string | undefined = ''

  constructor (
    private readonly configService: ConfigService,
    @Inject(EnvConfigsService)
    private readonly envConfigClient: EnvConfigsService,
  ) {
    const sendgridKey = this.configService.get<string>('sendgridKey')
    if (sendgridKey == null) throw new Error('SendGrid key not found')

    SendGrid.setApiKey(sendgridKey)
    this.sendGridEmail = this.configService.get('sendgridEmail')
  }

  async getTranslator (language?: string) {
    const store = global.als.getStore()

    const desiredLanguage = store?.bypassTenant ? language : undefined

    const translator = await this.envConfigClient.getTranslator(desiredLanguage)
    if (!translator) throw new Error('Translator not found')
    return translator
  }

  async send (mail: SendGrid.MailDataRequired) {
    if (process.env.VITE_APP_ENV === 'ci') {
      console.warn(`Email not sent to ${mail.to} in test environment`)
      return
    }
    const transport = await SendGrid.send(mail)

    // eslint-disable-next-line no-console
    console.log(`Email successfully dispatched to ${mail.to}`)
    return transport
  }

  async sendRequestResetPasswordEmail (
    user: { firstName: string; lastName: string, title?: string },
    token: string,
    email: string,
    language?: string,
  ) {
    const translator = await this.getTranslator(language)

    const link = `${this.configService.get('appUrl')}/auth/reset-password?token=${token}`

    const userName = user != null ? getFullName(user, true) : email

    const logo = `${this.configService.get('appUrl')}/${emailLogoFile}`

    const mail = {
      to: email,
      subject: translator.fromLabel('emails_sendRequestResetPasswordEmail_subject'),
      from: this.sendGridEmail!,
      text: translator.fromLabel('emails_sendRequestResetPasswordEmail_text'),
      html: translator.fromLabel('emails_sendRequestResetPasswordEmail_html', { userName, link, logo }),
    }

    return await this.send(mail)
  }

  async sendVerifyEmail (
    user: { email: string; firstName: string; lastName: string, title?: string },
    token: string,
    language?: TranslatorLanguage
  ) {
    const translator = await this.getTranslator(language)

    const link = `${this.configService.get('appUrl')}/auth/verify-email?token=${token}`

    const logo = `${this.configService.get('appUrl')}/${emailLogoFile}`

    const mail = {
      to: user.email,
      subject: translator.fromLabel('emails_sendVerifyEmail_subject'),
      from: this.sendGridEmail!,
      text: translator.fromLabel('emails_sendVerifyEmail_text'),
      html: translator.fromLabel('emails_sendVerifyEmail_html', {
        userName: getFullName(user, true),
        link,
        logo,
      }),
    }

    return await this.send(mail)
  }

  async sendActivateUserRequest ({
    email, firstName, lastName, title
  }: {
    email: string, firstName: string, lastName: string, title?: string
  }, userId: string) {
    const translator = await this.getTranslator()

    const logo = `${this.configService.get('appUrl')}/${emailLogoFile}`

    const link = `${this.configService.get('appUrl')}/users/${userId}`

    const mail = {
      to: email,
      subject: translator.fromLabel('emails_sendActivateUserRequest_subject'),
      from: this.sendGridEmail!,
      text: translator.fromLabel('emails_sendActivateUserRequest_text'),
      html: translator.fromLabel('emails_sendActivateUserRequest_html', {
        userName: getFullName({ firstName, lastName, title }, true),
        logo,
        link,
      }),
    }

    return await this.send(mail)
  }

  async sendNewContractEmail ({
    email, firstName, lastName, title
  }: {
    email: string, firstName: string, lastName: string, title?: string
  }) {
    const translator = await this.getTranslator()

    const logo = `${this.configService.get('appUrl')}/${emailLogoFile}`

    const mail = {
      to: email,
      subject: translator.fromLabel('emails_newContractAssigned_subject'),
      from: this.sendGridEmail!,
      text: translator.fromLabel('emails_newContractAssigned_text'),
      html: translator.fromLabel('emails_newContractAssigned_html', {
        userName: getFullName({ firstName, lastName, title }, true),
        logo,
      }),
    }

    return await this.send(mail)
  }

  async sendEmail ({
    email, subject, text, textParams, html, htmlParams, language
  }: {
    email: string,
    subject: string,
    text: string,
    textParams?: Record<string, any>,
    html: string,
    htmlParams?: Record<string, any>,
    language?: TranslatorLanguage
  }) {
    const translator = await this.getTranslator(language)
    const mail = {
      to: email,
      subject: translator.fromLabel(subject),
      from: this.sendGridEmail!,
      text: translator.fromLabel(text, textParams),
      html: translator.fromLabel(html, htmlParams),
    }

    return await this.send(mail)
  }
}
