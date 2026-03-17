import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

type SendResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Month-Track <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      text: params.text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id ?? '' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Greška pri slanju emaila.',
    };
  }
}
