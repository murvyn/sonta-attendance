'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FaceDetectionPreview } from '@/components/common/face-detection-preview';
import type { SontaHead } from '@/types';
import { SontaHeadStatus } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.nativeEnum(SontaHeadStatus).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SontaHeadFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues, image?: File) => Promise<void>;
  sontaHead?: SontaHead | null;
  isLoading?: boolean;
}

export function SontaHeadForm({
  open,
  onClose,
  onSubmit,
  sontaHead,
  isLoading,
}: SontaHeadFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!sontaHead;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sontaHead?.name || '',
      phone: sontaHead?.phone || '',
      email: sontaHead?.email || '',
      notes: sontaHead?.notes || '',
      status: sontaHead?.status || SontaHeadStatus.ACTIVE,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setImageError('Only JPG, PNG, or WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!isEditing && !imageFile) {
      setImageError('Profile image is required');
      return;
    }

    // Validate face detection for new uploads
    if (!isEditing && imageFile && !faceDetected) {
      setImageError('Please upload a photo with a clearly visible face');
      return;
    }

    await onSubmit(values, imageFile || undefined);
  };

  const handleClose = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setFaceDetected(false);
    onClose();
  };

  const existingImageUrl = sontaHead?.profileImageUrl
    ? sontaHead.profileImageUrl.startsWith('http')
      ? sontaHead.profileImageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${sontaHead.profileImageUrl}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? 'Edit Sonta Head' : 'Add New Sonta Head'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Profile Image with Face Detection */}
            <div className="space-y-3">
              <FormLabel>Profile Image {!isEditing && '*'}</FormLabel>

              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {imagePreview || existingImageUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Face Detection Preview */}
              <FaceDetectionPreview
                imageUrl={imagePreview || existingImageUrl}
                imageFile={imageFile}
                onDetectionResult={(result) => {
                  setFaceDetected(result.detected && result.faceCount === 1);
                  if (!result.detected || result.faceCount !== 1) {
                    setImageError(result.message);
                  } else {
                    setImageError(null);
                  }
                }}
              />

              {imageError && (
                <p className="text-sm text-danger font-medium">{imageError}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="+233201234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SontaHeadStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={SontaHeadStatus.INACTIVE}>Inactive</SelectItem>
                        <SelectItem value={SontaHeadStatus.SUSPENDED}>Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
