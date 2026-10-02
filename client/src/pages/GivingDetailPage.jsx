import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Button, Card, ErrorState, Field, Spinner, inputClass } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function loadScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function GivingDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState(500);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/donations/campaigns/${id}`)
      .then(({ data }) => setCampaign(data.data.campaign))
      .catch((err) => setError(err.message));
  }, [id]);

  async function donate() {
    try {
      const ready = await loadScript();
      if (!ready) throw new Error('Could not load Razorpay checkout');
      const { data } = await api.post('/donations/orders', { campaign_id: id, amount });
      const order = data.data;
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'SIES Alumni Network Portal',
        description: campaign.title,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await api.post('/donations/verify', {
              donation_id: order.donation_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment verified. Thank you!');
            const refreshed = await api.get(`/donations/campaigns/${id}`);
            setCampaign(refreshed.data.data.campaign);
          } catch (err) {
            toast.error(err.message);
          }
        },
        prefill: { name: user.full_name, email: user.email },
        theme: { color: '#6B1C23' },
        modal: {
          ondismiss: async () => {
            await api.post('/donations/fail', { donation_id: order.donation_id, status: 'CANCELLED' });
            toast.info('Payment cancelled');
          }
        }
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!campaign) return <Spinner />;

  return (
    <Card>
      <h1 className="font-display text-3xl text-maroon-800">{campaign.title}</h1>
      <p className="mt-3">{campaign.description}</p>
      <p className="mt-3">Collected ₹{Number(campaign.collected_amount).toLocaleString()} of ₹{Number(campaign.target_amount).toLocaleString()}</p>
      <Field label="Amount (INR)">
        <input className={inputClass()} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Button className="mt-4" onClick={donate}>
        Donate with Razorpay sandbox
      </Button>
    </Card>
  );
}
