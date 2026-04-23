<?php

namespace App\Entity;

use App\Repository\PersonRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PersonRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Person
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(inversedBy: 'people')]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(name: 'avatar_url', length: 500, nullable: true)]
    private ?string $avatarUrl = null;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    // Liens dont cette personne est l'initiateur (person_a)
    #[ORM\OneToMany(targetEntity: CharacterLink::class, mappedBy: 'personA', orphanRemoval: true)]
    private Collection $linksAsA;

    // Liens dont cette personne est la cible (person_b)
    #[ORM\OneToMany(targetEntity: CharacterLink::class, mappedBy: 'personB', orphanRemoval: true)]
    private Collection $linksAsB;

    public function __construct()
    {
        $this->id        = Uuid::v4();
        $this->createdAt = new \DateTimeImmutable();
        $this->linksAsA  = new ArrayCollection();
        $this->linksAsB  = new ArrayCollection();
    }

    public function getId(): Uuid                  { return $this->id; }
    public function getUser(): User                { return $this->user; }
    public function setUser(User $u): static       { $this->user = $u; return $this; }
    public function getName(): string              { return $this->name; }
    public function setName(string $n): static     { $this->name = $n; return $this; }
    public function getBio(): ?string              { return $this->bio; }
    public function setBio(?string $b): static     { $this->bio = $b; return $this; }
    public function getAvatarUrl(): ?string        { return $this->avatarUrl; }
    public function setAvatarUrl(?string $u): static { $this->avatarUrl = $u; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    /** Retourne tous les liens (dans les deux sens) */
    public function getAllLinks(): Collection
    {
        return new ArrayCollection(
            array_merge($this->linksAsA->toArray(), $this->linksAsB->toArray())
        );
    }
}
