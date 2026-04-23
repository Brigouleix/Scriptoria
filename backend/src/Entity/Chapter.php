<?php

namespace App\Entity;

use App\Repository\ChapterRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ChapterRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Chapter
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(inversedBy: 'chapters')]
    #[ORM\JoinColumn(nullable: false)]
    private Project $project;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'order_index', type: 'integer')]
    private int $orderIndex = 0;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->id        = Uuid::v4();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid                  { return $this->id; }
    public function getProject(): Project          { return $this->project; }
    public function setProject(Project $p): static { $this->project = $p; return $this; }
    public function getUser(): User                { return $this->user; }
    public function setUser(User $u): static       { $this->user = $u; return $this; }
    public function getTitle(): string             { return $this->title; }
    public function setTitle(string $t): static    { $this->title = $t; return $this; }
    public function getDescription(): ?string      { return $this->description; }
    public function setDescription(?string $d): static { $this->description = $d; return $this; }
    public function getOrderIndex(): int           { return $this->orderIndex; }
    public function setOrderIndex(int $i): static  { $this->orderIndex = $i; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
