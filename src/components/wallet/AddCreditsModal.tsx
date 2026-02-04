import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Loader2,
  Shield,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const presetAmounts = [500, 1000, 2000, 5000, 10000];

const paymentMethods = [
  { id: 'card', name: 'Debit/Credit Card', icon: CreditCard, badge: 'Instant' },
  { id: 'upi', name: 'UPI Payment', icon: Wallet, badge: 'Instant' },
  { id: 'international', name: 'International Card', icon: Globe, badge: 'All Countries' },
];

type Step = 'amount' | 'method' | 'processing' | 'success';

export function AddCreditsModal({ open, onOpenChange, onSuccess }: AddCreditsModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [retryCount, setRetryCount] = useState(0);

  const handleClose = () => {
    setStep('amount');
    setAmount(1000);
    setCustomAmount('');
    setPaymentMethod('card');
    setRetryCount(0);
    onOpenChange(false);
  };

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCustomAmount(value);
    if (value) {
      setAmount(parseInt(value));
    }
  };

  const handleProceedToPayment = () => {
    if (amount >= 100) {
      setStep('method');
    }
  };

  const handlePayment = async () => {
    setStep('processing');
    
    // Simulate payment processing with auto-retry
    const processPayment = async (attempt: number): Promise<boolean> => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 90% success rate, auto-retry on failure
      const success = Math.random() > 0.1;
      
      if (!success && attempt < 3) {
        setRetryCount(attempt);
        return processPayment(attempt + 1);
      }
      
      return success;
    };

    const success = await processPayment(1);
    
    if (success) {
      setStep('success');
      onSuccess?.();
    } else {
      // Even after retries, show success (for demo purposes)
      setStep('success');
      onSuccess?.();
    }
  };

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {/* Step 1: Amount Selection */}
        {step === 'amount' && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Add Credits</DialogTitle>
              <DialogDescription>
                Select amount to add to your wallet
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Preset amounts */}
              <div className="grid grid-cols-5 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset && !customAmount ? 'default' : 'outline'}
                    className={cn(
                      'h-12',
                      amount === preset && !customAmount && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => handleAmountSelect(preset)}
                  >
                    ₹{preset >= 1000 ? `${preset / 1000}K` : preset}
                  </Button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="space-y-2">
                <Label htmlFor="custom-amount">Or enter custom amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="custom-amount"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="pl-8"
                  />
                </div>
                {finalAmount < 100 && finalAmount > 0 && (
                  <p className="text-xs text-destructive">Minimum amount is ₹100</p>
                )}
              </div>

              {/* Summary */}
              <div className="glass-card rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground">₹{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <Button
                className="w-full bg-orange-gradient hover:opacity-90 text-white h-12"
                disabled={finalAmount < 100}
                onClick={handleProceedToPayment}
              >
                Continue to Payment
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Payment Method */}
        {step === 'method' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setStep('amount')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="font-display text-xl">Payment Method</DialogTitle>
                  <DialogDescription>
                    Adding ₹{finalAmount.toLocaleString()} to wallet
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <method.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{method.name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {method.badge}
                    </Badge>
                  </div>
                ))}
              </RadioGroup>

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Shield className="h-4 w-4 text-success" />
                <span>256-bit SSL encrypted • PCI DSS compliant • No card data stored</span>
              </div>

              <Button
                className="w-full bg-orange-gradient hover:opacity-90 text-white h-12"
                onClick={handlePayment}
              >
                Pay ₹{finalAmount.toLocaleString()}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Processing Payment
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {retryCount > 0 
                  ? 'Retrying... please wait'
                  : 'Please wait, do not close this window'
                }
              </p>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Auto-retry attempt {retryCount}/3
              </p>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Payment Successful!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                ₹{finalAmount.toLocaleString()} added to your wallet
              </p>
            </div>
            <Button
              className="w-full bg-orange-gradient hover:opacity-90 text-white"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
