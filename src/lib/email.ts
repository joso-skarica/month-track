import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const USER_FACING_SEND_ERROR =
  'Slanje na vanjske adrese trenutno nije omogućeno dok nije potvrđena domena za e-poštu.';

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
      console.error('[email] Resend API error:', error.message);
      return {
        success: false,
        error: USER_FACING_SEND_ERROR,
      };
    }

    return { success: true, id: data?.id ?? '' };
  } catch (err) {
    console.error('[email] Unexpected error:', err);
    return {
      success: false,
      error: USER_FACING_SEND_ERROR,
    };
  }
}
