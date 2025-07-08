"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

// Form için validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form işlemleri için React Hook Form kullanıyoruz
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      const success = await login(values.email, values.password);
      
      if (success) {
        toast.success('Giriş başarılı!');
        router.push('/dashboard');
      } else {
        toast.error(error || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
      }
    } catch (err) {
      toast.error('Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-32 h-32 relative mb-4">
            <Image
              src="/logo.png"
              alt="BeU Logo"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Hoş Geldiniz</CardTitle>
          <CardDescription className="text-center">
            BeU Sistemine giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@beu.com.tr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || loading}
              >
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BeU Güzellik ve Wellness Sistemi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
