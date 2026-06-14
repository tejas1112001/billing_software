import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { storeService } from '@/services/storeService';
import type { Store as StoreType } from '@/types';

interface StoreComboboxProps {
  value: StoreType | null;
  onChange: (store: StoreType) => void;
  placeholder?: string;
}

export function StoreCombobox({ value, onChange, placeholder = 'Search and select a store...' }: StoreComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: stores = [] } = useQuery<StoreType[]>({
    queryKey: ['stores-all'],
    queryFn: () => storeService.getAll(),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="group w-full justify-between h-11 text-left font-normal"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-white" />
            {value ? (
              <span className="truncate">
                {value.name}
                <span className="text-muted-foreground group-hover:text-white/80 ml-1 text-xs">— {value.city}</span>
              </span>
            ) : (
              <span className="text-muted-foreground group-hover:text-white">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:text-white group-hover:opacity-100" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search stores..." className="h-10" />
          <CommandList>
            <CommandEmpty>No stores found.</CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={`${store.name} ${store.city}`}
                  onSelect={() => {
                    onChange(store);
                    setOpen(false);
                  }}
                  className="group flex items-center gap-2 py-2.5"
                >
                  <Check
                    className={cn('h-4 w-4 shrink-0', value?.id === store.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{store.name}</p>
                    <p className="text-xs text-muted-foreground group-data-[selected=true]:text-white/80">{store.city} · {store.mobile}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
