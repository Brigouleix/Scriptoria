<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ProjectRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Project
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(inversedBy: 'projects')]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $genre = null;

    #[ORM\Column(name: 'project_type', length: 10)]
    private string $projectType = 'novel'; // 'novel' | 'team'

    #[ORM\Column(name: 'cover_url', length: 500, nullable: true)]
    private ?string $coverUrl = null;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    // Relations
    #[ORM\OneToMany(targetEntity: SnowflakeStep::class, mappedBy: 'project', orphanRemoval: true)]
    private Collection $snowflakeSteps;

    #[ORM\OneToMany(targetEntity: Chapter::class, mappedBy: 'project', orphanRemoval: true)]
    #[ORM\OrderBy(['orderIndex' => 'ASC'])]
    private Collection $chapters;

    public function __construct()
    {
        $this->id             = Uuid::v4();
        $this->createdAt      = new \DateTimeImmutable();
        $this->updatedAt      = new \DateTimeImmutable();
        $this->snowflakeSteps = new ArrayCollection();
        $this->chapters       = new ArrayCollection();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    // ── Getters / Setters ──────────────────────────────────────
    public function getId(): Uuid                  { return $this->id; }
    public function getUser(): User                { return $this->user; }
    public function setUser(User $user): static    { $this->user = $user; return $this; }
    public function getTitle(): string             { return $this->title; }
    public function setTitle(string $t): static    { $this->title = $t; return $this; }
    public function getGenre(): ?string            { return $this->genre; }
    public function setGenre(?string $g): static   { $this->genre = $g; return $this; }
    public function getProjectType(): string       { return $this->projectType; }
    public function setProjectType(string $t): static { $this->projectType = $t; return $this; }
    public function getCoverUrl(): ?string         { return $this->coverUrl; }
    public function setCoverUrl(?string $u): static { $this->coverUrl = $u; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function getSnowflakeSteps(): Collection { return $this->snowflakeSteps; }
    public function getChapters(): Collection       { return $this->chapters; }
}
