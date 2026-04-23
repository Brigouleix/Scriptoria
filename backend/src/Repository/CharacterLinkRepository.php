<?php

namespace App\Repository;

use App\Entity\CharacterLink;
use App\Entity\Person;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CharacterLink>
 */
class CharacterLinkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CharacterLink::class);
    }

    /** Tous les liens impliquant un personnage (des deux côtés) */
    public function findByPerson(Person $person): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.personA = :person OR l.personB = :person')
            ->setParameter('person', $person)
            ->getQuery()
            ->getResult();
    }

    /** Tous les liens d'un utilisateur */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }
}
