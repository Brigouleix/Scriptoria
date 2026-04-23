<?php

namespace App\Entity;

use App\Repository\SnowflakeStepRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SnowflakeStepRepository::class)]
#[ORM\Table(name: 'snowflake_step')]
#[ORM\HasLifecycleCallbacks]
class SnowflakeStep
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(inversedBy: 'snowflakeSteps')]
    #[ORM\JoinColumn(nullable: false)]
    private Project $project;

    /** Étape 1 = Prémisse, 2 = Résumé, 3 = Personnages, 4 = Synopsis */
    #[ORM\Column(name: 'step_number', type: 'smallint')]
    private int $stepNumber;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $content = null;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->id        = Uuid::v4();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): Uuid                   { return $this->id; }
    public function getProject(): Project           { return $this->project; }
    public function setProject(Project $p): static  { $this->project = $p; return $this; }
    public function getStepNumber(): int            { return $this->stepNumber; }
    public function setStepNumber(int $n): static   { $this->stepNumber = $n; return $this; }
    public function getContent(): ?string           { return $this->content; }
    public function setContent(?string $c): static  { $this->content = $c; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
}
