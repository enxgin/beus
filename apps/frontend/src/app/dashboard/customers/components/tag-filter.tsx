"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TagOption {
  id: string
  name: string
  color: string
  customerCount: number
}

interface TagFilterProps {
  tags: TagOption[]
  selectedTags: string[]
  onTagsChange: (tagIds: string[]) => void
  isLoading?: boolean
}

export function TagFilter({ tags, selectedTags, onTagsChange, isLoading }: TagFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId]
    
    onTagsChange(newSelectedTags)
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  const selectedTagsData = tags.filter(tag => selectedTags.includes(tag.id))
  
  // Arama sonuçlarını filtrele
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {selectedTags.length === 0 ? (
                "Etiket Filtrele"
              ) : (
                `${selectedTags.length} etiket seçili`
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-medium text-sm">Etiket Filtrele</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[300px] overflow-auto">
            <div className="p-2">
              <Input
                placeholder="Etiket ara..."
                className="h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="px-1 pb-1">
              {filteredTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                  Etiket bulunamadı.
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors mx-1"
                    onClick={() => {
                      handleTagToggle(tag.id)
                      console.log('Tag clicked:', tag.name)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleTagToggle(tag.id)
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        selectedTags.includes(tag.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between w-full min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="truncate">{tag.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                        {tag.customerCount}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {selectedTags.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllTags}
                  className="w-full h-8"
                >
                  Tümünü Temizle
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Seçili etiketleri göster */}
      {selectedTagsData.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedTagsData.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              style={{
                backgroundColor: tag.color + '20',
                borderColor: tag.color,
                color: tag.color
              }}
              className="cursor-pointer hover:opacity-80"
              onClick={() => handleTagToggle(tag.id)}
            >
              {tag.name}
              <span className="ml-1 text-xs">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}